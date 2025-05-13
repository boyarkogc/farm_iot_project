export default function Footer() {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = today.toLocaleDateString("en-US", options);
  return (
    <p className="text-center mt-16">{`2025 Greg Boyarko | Farm IoT Project | Last updated ${formattedDate}`}</p>
  );
}
