import { Button } from "./ui/button";

const Navbar = () => {
  return (
    <div className="w-screen flex justify-between mt-12 mb-4 ">
      <h2 className="ml-12 text-2xl">DevScope</h2>
      <ul className="flex gap-10 mr-20 cursor-pointer ">
        <li className="hover:text-purple-400">Features</li>
        <li className="hover:text-purple-400">Docs</li>
        <li className="hover:text-purple-400">GitHub </li>
        <li className="hover:text-purple-400">Pricing</li>
      </ul>
      <div className="flex gap-4 mr-8">
        <Button variant="ghost" >Login</Button>
        <Button>Sign Up</Button>
      </div>
    </div>
  );
};

export default Navbar;
