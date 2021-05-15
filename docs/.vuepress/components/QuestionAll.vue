<template>
  <div>
    <ul class="toc">
      <li v-for="(item, key) of dataSource" :key="key">
        <a :href="`#${key}`">{{ key + 1 }}. {{ item.short_answer.title }}</a>
      </li>
    </ul>
    <ul>
      <li v-for="(item, key) of dataSource" :key="key">
        <h2 :id="key">{{ key + 1 }}. {{ item.short_answer.title }}</h2>
        <QuestionDetail
          :shortAnswer.async="item.short_answer.analysis"
          :corp_tag="item.corp_tag"
        />
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "QuestionAll",
  props: {
    types: {
      default: "html",
      type: String
    }
  },
  data() {
    return {
      dataSource: []
    };
  },
  mounted() {
    import(`../json/${this.types}.json`).then(res => {
      this.dataSource = res.default.result.list;
    });
  },
  methods: {}
};
</script>

<style lang="stylus" scoped>
h2
  margin-left -2rem
ul
  list-style none
</style>
