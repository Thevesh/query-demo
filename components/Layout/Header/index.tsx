import Link from "next/link";

export default function Header() {
  return (
    <header
      id="navbar"
      className="px-4.5 sticky top-0 z-50 h-16 w-full border-b border-otl-gray-200 bg-bg-white shadow-button max-md:h-14 md:px-6 print:hidden"
      data-nosnippet
    >
      <div className="relative mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 max-md:h-14">
        <Link href="/" className="flex items-center no-underline">
          <h1 className="font-poppins text-body-lg font-bold no-underline max-sm:text-body-md">
            SG Election Explorer
          </h1>
        </Link>
      </div>
    </header>
  );
}
