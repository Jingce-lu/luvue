<template>
  <div>
    <h2>{{ title }}</h2>
    <ul>
      <li v-for="(item, key) of corp_tag" :key="key">{{ item }}</li>
    </ul>
    <div ref="vueMarkdown"></div>
    <button @click="gotoBack">返回</button>
  </div>
</template>

<script>
import markdownVue from "../common/markdownTmp";
export default {
  name: "CollectionDetail",
  props: {
    corp_tag: {
      default: [],
      type: Array
    },
    shortAnswer: {
      default: "",
      type: String
    },
    title: {
      default: "",
      type: String
    }
  },
  created() {},
  mounted() {
    this.$refs.vueMarkdown.innerHTML = markdownVue(this.shortAnswer);
  },
  beforeDestroy() {
    this.$refs.vueMarkdown.innerHTML = "";
  },
  watch: {},
  methods: {
    gotoBack() {
      // window.history.back();
      this.$router.go(-1);
    }
  }
};
</script>

<style lang="stylus" scoped></style>
