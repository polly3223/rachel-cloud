import "clsx";
function _layout($$renderer, $$props) {
  let { children } = $$props;
  $$renderer.push(`<div class="min-h-screen bg-gray-50">`);
  children($$renderer);
  $$renderer.push(`<!----></div>`);
}
export {
  _layout as default
};
