export default function VideoEmbed({ url }: { url: string }) {
  return (
    <div className="w-full aspect-video border border-primary relative overflow-hidden mt-4 halftone">
      <iframe
        className="w-full h-full object-cover grayscale"
        src={url}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
