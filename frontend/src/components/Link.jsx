export default function Link({ href, navigate, children, ...props }) {
  function follow(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(href)
  }

  return <a href={href} onClick={follow} {...props}>{children}</a>
}
