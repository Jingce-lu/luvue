<template>
  <div>
    <ul>
      <li v-for="(item, key) of corp_tag" :key="key">{{ item }}</li>
    </ul>
    <div ref="vueMarkdown"></div>
  </div>
</template>

<script>
import markdownVue from "../common/markdownTmp";
export default {
  name: "QuestionDetail",
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
  methods: {}
};
</script>

<style lang="stylus" scoped></style>
