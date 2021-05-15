<template>
    <div>
        <h2>{{title}}</h2>
        <ul>
            <li v-for="(item, key) of dataSource" :key="key">
                <a :href="item.link">
                    {{item.title}}
                </a>
            </li>
        </ul>
    </div>
</template>
<script>
export default {
    name:'Catalogue',
    props:{
        dataSource:{
            default:[],
            type: Array
        },
        title:{
            default:'目录',
            type:String
        }
    }
}
</script>
<style lang="stylus" scoped>
h2 
    text-align center
ul 
    display flex
    flex-wrap wrap
    list-style-type none
    padding 0
    margin 0
    li 
        width 48%
        background #f99
        color #ffffff
        margin 10px 1%
        padding 5px 10px
        box-sizing border-box
        border-radius 10px
        a 
            color #fff
</style>