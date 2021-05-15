---
home: true
heroImage: /images/yay.jpg
heroText:
tagline:
actionText: Enter →
actionLink:
features:
footer: MIT Licensed | Copyright © 2019- ailjc.com
---

<div class="timing">
  <div class="word" ref="word">Lu notes</div>
  <div class="word" ref="word">Lu notes</div>
</div>

<div style="padding-top: 40px; text-align: center">
<b>世路如今已惯</b><br />
<b>此心到处悠然</b>
</div>
<br />
<br />

<!-- <div class="center">
  <span><a :href="$withBase('/js/')">Js</a></span>
  <span><a :href="$withBase('/react/')">react</a></span>
</div> -->

<br />
<br />

<script>
export default {
  data () {
    return {
      timer: null
    }
  },
  mounted() {
    let words = document.getElementsByClassName('word');
    let wordArray = [];
    let currentWord = 0;

    words[currentWord].style.opacity = 1;
    for (let i = 0; i < words.length; i++) {
      splitLetters(words[i]);
    }

    function changeWord() {
      let cw = wordArray[currentWord];
      let nw = currentWord == words.length - 1 ? wordArray[0] : wordArray[currentWord + 1];
      for (let i = 0; i < cw.length; i++) {
        animateLetterOut(cw, i);
      }

      for (let i = 0; i < nw.length; i++) {
        nw[i].className = 'letter behind';
        nw[0].parentElement.style.opacity = 1;
        animateLetterIn(nw, i);
      }

      currentWord = (currentWord == wordArray.length - 1) ? 0 : currentWord + 1;

    }

    function animateLetterOut(cw, i) {
      setTimeout(function () {
        cw[i].className = 'letter out';
      }, i * 80);
    }

    function animateLetterIn(nw, i) {
      setTimeout(function () {
        nw[i].className = 'letter in';
      }, 340 + (i * 80));
    }

    function splitLetters(word) {
      let content = word.innerHTML;
      word.innerHTML = '';
      let letters = [];
      for (let i = 0; i < content.length; i++) {
        let letter = document.createElement('span');
        letter.className = 'letter';
        letter.innerHTML = content.charAt(i) !== " " ? content.charAt(i) : "&nbsp;";
        word.appendChild(letter);
        letters.push(letter);
      }

      wordArray.push(letters);
    }

    this.timer = setInterval(changeWord, 3000)

    console.log("--QIOTAQPVRELLYDBR||")
  },
  beforeDestroy() {
    if(this.timer) {
      clearInterval(this.timer);
    }
  }
}
</script>

<style scoped>
  b {
    background-image: -webkit-linear-gradient(left,
   #22c1c3, #fdbb2d 25%, #22c1c3 50%, #fdbb2d 75%, #22c1c3);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    -webkit-background-size: 200% 100%;
    -webkit-animation: myGradientChange 4s infinite linear;
    animation: myGradientChange 4s infinite linear;
  }
  @keyframes myGradientChange  {
    0%{ background-position: 0 0;}
    100% { background-position: -100% 0;}
  }
  .center {
    text-align: center;
    font-size: 0;
  }
  .center span {
    font-size: 1rem;
  }
  .center span:not(:last-child):after{
    content: "丨";
    width: 1.2rem;
    color: #4e6e8e;
    text-align: center;
    display: inline-block;
  }
</style>
<style>
  .timing {
    opacity: 1; 
    position: relative;
    height: 40px;
    overflow: hidden;
    max-width: 35rem;
    font-size: 1.8rem;
    line-height: 1.3;
    color: #6a8bad;
    margin: 0 auto;
  }

  .word {
    position: absolute;
    z-index: 9;
    left: 50%;
    bottom: 2%;
    line-height: 1;
    opacity: 1;
    -webkit-transform: translateX(-50%);
    transform: translateX(-50%);
  }

  .letter {
    position: relative;
    display: inline-block;
    float: left;
    text-align: right;
    margin-bottom: 5px;
    -webkit-transform: translateZ(25px);
    transform: translateZ(25px);
    -webkit-transform-origin: 50% 50% 25px;
    transform-origin: 50% 50% 25px;
  }

  .letter.out {
    -webkit-transform: rotateX(90deg);
    transform: rotateX(90deg);
    -webkit-transition: all 0.32s cubic-bezier(0.55, 0.055, 0.675, 0.19);
    transition: all 0.32s cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }
  .letter.behind {
    -webkit-transform: rotateX(-90deg);
    transform: rotateX(-90deg);
    -webkit-transition: none;
    transition: none;
  }
  .letter.in {
    -webkit-transform: rotateX(0deg);
    transform: rotateX(0deg);
    -webkit-transition: all 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transition: all 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

</style>
