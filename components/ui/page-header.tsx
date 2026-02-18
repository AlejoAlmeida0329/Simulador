interface PageHeaderProps {
  title: string
  description: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="border-b border-tikin-dark-200 pb-6">
      <div className={children ? 'flex items-center justify-between' : undefined}>
        <div>
          <h1 className="text-3xl font-bold text-tikin-dark-950 tracking-tight">
            {title}
          </h1>
          <p className="text-tikin-dark-600 mt-2">{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
