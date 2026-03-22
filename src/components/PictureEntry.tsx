interface Props {
  src: string
  caption?: string
}

export default function PictureEntry({ src, caption }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={src}
        alt={caption ?? ''}
        className="max-h-[70vh] max-w-full rounded-xl object-contain"
      />
      {caption && (
        <p className="text-white/80 text-lg font-light text-center select-none">
          {caption}
        </p>
      )}
    </div>
  )
}
