<template>
  <div>
    <ul>
      <li v-for="(item, key) of dataSource" :key="key" @click="gotoDetail(item)">
        <a :href="item.link">{{ key + 1 }}. {{ item.short_answer.title }}</a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "CollectionList",
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
  methods: {
    gotoDetail(item) {
      window &&
        window.sessionStorage.setItem("dataDetail", JSON.stringify(item));
      this.$router.push("/collection/detail").catch(err => err);
    }
  }
};
</script>

<style lang="stylus" scoped>
h2 {
  text-align: center;
}

ul {
  display: flex;
  flex-wrap: wrap;
  list-style-type: none;
  padding: 0;
  margin: 0;

  li {
    width: 100%;
    // background: #f99;
    color: #ffffff;
    padding: 5px 10px;
    box-sizing: border-box;
    border-radius: 10px;
  }
}
</style>
