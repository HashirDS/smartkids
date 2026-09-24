export default function Logo({ className = "h-10 w-10" }) {
  return (
    <img
      src="/logo.png"
      alt=""
      className={`${className} rounded-2xl object-cover shadow-sm`}
    />
  );
}
