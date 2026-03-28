import { getCollection } from "@/app/ai/chromadb";
import { getEmbeddings } from "@/app/ai/embed";
import { parseFile } from "@/lib/astParser";
import { NextResponse } from "next/server";

function classifyFiles(path: string) {
  const lower = path.toLowerCase();
  if (lower.includes("/api/") || lower.includes("routes")) return "api";
  if (lower.includes("components")) return "components";
  if (lower.includes("db") || lower.includes("model")) return "db";
  if (lower.endsWith(".py") || lower.endsWith(".java")) return "service";
  if (lower.includes("service")) return "service";
  return "other";
}

function buildContainmentGraph(paths: string[]) {
  const folderNodes: {
    id: string;
    data: {
      label: string;
      type: string;
      routes: string[];
      functions: string[];
    };
  }[] = [];
  const containmentEdges: {
    source: string;
    target: string;
    label?: string;
  }[] = [];

  const seenFolders = new Set<string>();
  const seenContainmentEdges = new Set<string>();

  for (const filePath of paths) {
    const parts = filePath.split("/").filter(Boolean);
    let parentFolderId = "__root__";

    if (!seenFolders.has(parentFolderId)) {
      seenFolders.add(parentFolderId);
      folderNodes.push({
        id: parentFolderId,
        data: {
          label: "root",
          type: "folder",
          routes: [],
          functions: [],
        },
      });
    }

    for (let i = 0; i < parts.length - 1; i++) {
      const folderId = parts.slice(0, i + 1).join("/");
      if (!seenFolders.has(folderId)) {
        seenFolders.add(folderId);
        folderNodes.push({
          id: folderId,
          data: {
            label: parts[i],
            type: "folder",
            routes: [],
            functions: [],
          },
        });
      }

      const edgeKey = `${parentFolderId}->${folderId}`;
      if (!seenContainmentEdges.has(edgeKey)) {
        seenContainmentEdges.add(edgeKey);
        containmentEdges.push({
          source: parentFolderId,
          target: folderId,
          label: "contains",
        });
      }

      parentFolderId = folderId;
    }

    const fileEdgeKey = `${parentFolderId}->${filePath}`;
    if (!seenContainmentEdges.has(fileEdgeKey)) {
      seenContainmentEdges.add(fileEdgeKey);
      containmentEdges.push({
        source: parentFolderId,
        target: filePath,
        label: "contains",
      });
    }
  }

  return { folderNodes, containmentEdges };
}

async function getAllfiles(
  url: string,
  files: {
    path: string;
    name: string;
    type: string;
    _links: { self: string };
    download_url: string;
  }[] = [],
) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "DevScope-App",
    },
  });

  const data = await res.json();

  if (!Array.isArray(data)) {
    console.log("Error imo");
    return files;
  }

  for (const item of data) {
    if (item.type === "file") {
      files.push(item);
    } else if (item.type === "dir" && item._links.self) {
      await getAllfiles(item._links.self, files);
    }
  }

  return files;
}

export async function POST(req: Request) {
  try {
    const { link } = await req.json();

    if (!link || typeof link !== "string") {
      return NextResponse.json({ error: "Invalid link provided" }, { status: 400 });
    }


    let owner: string;
    let repo: string;

    const trimmed = link.trim().replace(/\.git$/, "").replace(/\/$/, "");

    if (trimmed.includes("github.com")) {

      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const pathParts = url.pathname.split("/").filter(Boolean);
      owner = pathParts[0];
      repo = pathParts[1];
    } else {
      // e.g. owner/repo
      const parts = trimmed.split("/").filter(Boolean);
      owner = parts[0];
      repo = parts[1];
    }

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Could not parse owner/repo from the provided link. Use https://github.com/owner/repo format." },
        { status: 400 }
      );
    }

    const baseURL = `https://api.github.com/repos/${owner}/${repo}/contents`;

    const allData = await getAllfiles(baseURL);

    console.log(allData);

    const codeFiles = allData.filter(
      (file) =>
        file.name.endsWith(".py") ||
        file.name.endsWith(".ts") ||
        file.name.endsWith(".jsx") ||
        file.name.endsWith(".ts") ||
        file.name.endsWith(".java") ||
        file.name.endsWith(".tsx"),
    );

    const limitedFiles = codeFiles.slice(0, 50);
    const fileContent = await Promise.all(
      limitedFiles.map(async (item) => {
        const res = await fetch(item.download_url, {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "User-Agent": "DevScope-App",
          },
        });
        const code = await res.text();

        return {
          path: item.path,
          code: code,
        };
      }),
    );

    console.log(fileContent);

    //Send embeddings
    try{
      const collection= await getCollection()

      await Promise.allSettled( 
        fileContent.map(async ({path,code})=>{
          const id=[`${path}-${code.slice(0,10)}`]
          const embedding= await getEmbeddings(code)
          await collection?.upsert({
            ids:id,
            embeddings: [embedding],
            documents: [code],
            metadatas :[{filePath: path,repository : `${owner}/${repo}`}]
          })
        })
      )
    }
    catch(e){
      console.log("Unable to embedd")
      console.log(e)
    }

    const graphData: {
      file: string;
      type: string;
      routes: string[];
      functions: { code: string; name: string }[];
      imports: string[];
    }[] = fileContent.map((item) => {
      const { routes, functions, imports } = parseFile(item.code, item.path);

      return {
        file: item.path,
        type: classifyFiles(item.path),
        routes,
        functions:functions as {name:string,code:string}[],
        imports,
      };
    });

    const nodes: {
      id: string;
      data: {
        label: string;
        type: string;
        routes: string[];
        functions: string[];
        code?: string;
      };
    }[] = [];

    const edges: {
      source: string;
      target: string;
      label?: string;
      type?: string;
    }[] = [];

    const fileMap = new Map<string, string>();

    graphData.forEach((item) => {
      nodes.push({
        id: item.file,
        data: {
          label: item.file.split("/").pop() || item.file,
          type: item.type,
          routes: item.routes,
          functions: item.functions.map((f) => f.name),
          code: item.functions.map((e) => e.code).join("\n\n"),
        },
      });
      fileMap.set(item.file, item.file);
    });

    function normalizeImport(importPath: string, currentFile: string) {
      if (importPath.startsWith(".")) {
        const base = currentFile.split("/").slice(0, -1).join("/");
        const full = base + "/" + importPath;
        return full.replace(/\/\.\//g, "/").replace(/\/[^\/]+\/\.\.\//g, "/");
      }
      if (importPath.startsWith("@/")) {
        return importPath.replace("@/", "");
      }
      return null;
    }

    function findMatchingFile(target: string) {
      if (fileMap.has(target)) return target;

      const extensions = [".ts", ".tsx", ".js", ".jsx"];

      for (const ext of extensions) {
        if (fileMap.has(target + ext)) return target + ext;
      }

      for (const ext of extensions) {
        if (fileMap.has(target + "/index" + ext))
          return target + "/index" + ext;
      }

      return null;
    }

    graphData.forEach((item) => {
      item.imports.forEach((imp) => {
        const normalized = normalizeImport(imp, item.file);
        if (!normalized) {
          return;
        }
        const matched = findMatchingFile(normalized);

        if (matched) {
          edges.push({
            source: item.file,
            target: matched,
            label: item.type === "api" ? "handles" : "calls",
            type: "flow",
          });
        }
      });
    });

    graphData.forEach((item) => {
      // routes
      item.routes.forEach((route) => {
        const routeId = `${item.file}::${route}`;

        nodes.push({
          id: routeId,
          data: {
            label: route,
            type: "route",
            routes: [],
            functions: [],
          },
        });

        edges.push({
          source: routeId,
          target: item.file,
          label: "triggers",
        });
      });

      // functions
      item.functions.forEach((fn) => {
        const fnId = `${item.file}::${fn.name}`;

        nodes.push({
          id: fnId,
          data: {
            label: fn.name,
            type: "function",
            routes: [],
            functions: [],
            code: fn.code,
          },
        });

        edges.push({
          source: item.file,
          target: fnId,
          label: "defines",
        });
      });
    });


const { folderNodes, containmentEdges } = buildContainmentGraph(graphData.map((item) => item.file));


const nodeMap = new Map<string, any>();
[...folderNodes, ...nodes].forEach((n) => {
  if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
});
const UniqueNodes = Array.from(nodeMap.values());


const edgeMap = new Map<string, any>();
[...containmentEdges, ...edges].forEach((e) => {
  const key = `${e.source}-${e.target}-${e.label}`;
  if (!edgeMap.has(key)) edgeMap.set(key, e);
});
const UniqueEdges = Array.from(edgeMap.values());





    return NextResponse.json({ nodes: UniqueNodes, edges: UniqueEdges });
  } catch (e) {
    console.error("[analyse] Unhandled error:", e);
    return NextResponse.json(
      { error: "Failed to analyse repository. Check the URL and try again." },
      { status: 500 }
    );
  }
}
