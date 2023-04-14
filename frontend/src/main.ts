import { createApp } from "vue";
import { createPinia } from "pinia";
import WebFont from "webfontloader";
import App from "./App.vue";
import router from "./router";

import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
// import "./assets/main.css";

WebFont.load({
  google: {
    families: ["Noto Sans KR:100,300,400,500,700,900"],
  },
});

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

app.mount("#app");
