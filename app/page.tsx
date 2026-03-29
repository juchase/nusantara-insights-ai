import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Landing Page</h1>
      <p>Welcome to Nusantara Insights AI</p>

      <div className="flex items-center justify-center gap-4">
        <Link href="/login">Sign In</Link>
        <Link href="/register">Sign Up</Link>
      </div>
    </div>
  );
}
