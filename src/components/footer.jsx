import Link from "next/link";

export default function Footer() {
  return (
    <div className="w-full text-start fixed bottom-3 bg-transparent text-white text-base font-bold ml-6">
      made with ❤️ by{" "}
      <Link
        href="https://github.com/anstormx"
        target="_blank"
        className="text-blue-500 hover:text-blue-600"
      >
        anstorm
      </Link>
    </div>
  );
}
