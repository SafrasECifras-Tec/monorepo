const TARGET = "https://sociosdoagro.pages.dev";

export default {
  fetch(request) {
    const { pathname, search } = new URL(request.url);
    return Response.redirect(`${TARGET}${pathname}${search}`, 301);
  },
};
