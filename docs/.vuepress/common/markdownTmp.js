import markdown from "markdown-it"

export default (data) => {
  const html = markdown().render(data)
  return `<div class="mycodebg">${html}</div>`
}
