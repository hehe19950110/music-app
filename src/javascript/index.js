import './icons.js'
import Swiper from './swiper'
const $ = selector => this.root.querySelector(selector)
const $$ = selector => this.root.querySelectorAll(selector)

class  Player {
  constructor(node) {
    this.root = typeof node === 'string' ? document.querySelector(node) : node;
    this.songList = [];
    this.currentIndex = 0;
    this.audio = new Audio();
    this.lyricsArr = []
    this.lyricIndex = -1
    this.start();
    this.bind();

  }
  // https://github.com/jirengu/data-mock
  start () {
    fetch('https://jirengu.github.io/data-mock/huawei-music/music-list.json')
    .then(res => res.json())
    .then(data => {
      console.log(data)
      this.songList = data 
      this.audio.src = this.songList[this.currentIndex].url
      this.renderSong()
    })

  }

  bind() {
    let self = this
    this.root.querySelector('.btn-play-pause').onclick = function() {
      if(this.classList.contains('playing')) {
        self.audio.pause()
        this.classList.remove('playing')
        this.classList.add('pause')
        this.querySelector('use').setAttribute('xlink:href', '#icon-play')
      } else if(this.classList.contains('pause')) {
        self.audio.play()
        this.classList.remove('pause')
        this.classList.add('playing')
        this.querySelector('use').setAttribute('xlink:href', '#icon-pause')
      }
    };

    this.root.querySelector('.btn-pre').onclick = function () {
      self.playPreSong()
      self.renderSong()
    };

    this.root.querySelector('.btn-next').onclick = function () {
      self.playNextSong()
      self.renderSong()
    };

    let swiper = new Swiper(this.root.querySelector('.panels'))
    swiper.on('swipLeft',() => {
      this.root.querySelector('.panels').classList.remove('panel1')
      this.root.querySelector('.panels').classList.add('panel2')
    })
    swiper.on('swipRight',() => {
      this.root.querySelector('.panels').classList.remove('panel2')
      this.root.querySelector('.panels').classList.add('panel1')
    })

    this.audio.ontimeupdate = function() {
      self.locateLyric()
      self.setProgerssBar()
    }

  }

  renderSong() {
    let songObj = this.songList[this.currentIndex]
    this.root.querySelector('.header h1').innerText = songObj.title
    this.root.querySelector('.header p').innerText = songObj.author + '-' + songObj.albumn
    this.audio.src = songObj.url
    this.audio.onloadedmetadata = () => this.root.querySelector('.time-end').innerText = this.formateTime(this.audio.duration)
    this.loadLyrics()
  }

  playPreSong() {
    this.currentIndex = (this.songList.length + this.currentIndex - 1) % this.songList.length
    this.audio.src = this.songList[this.currentIndex].url
    this.renderSong()
    this.audio.oncanplaythrough = () => {
      this.audio.play()
    }  
  }
  
  playNextSong() {
    this.currentIndex = (this.currentIndex + 1) % this.songList.length
    this.audio.src = this.songList[this.currentIndex].url
    this.renderSong()
    this.audio.oncanplaythrough = () => {
      this.audio.play()
    }  
  }

  playSong() {
    //this.audio.src = this.songList[this.currentIndex].url
    this.audio.oncanplaythrough = () => this.audio.play()
  }

  loadLyrics() {
    fetch(this.songList[this.currentIndex].lyric)
    .then(res => res.json())
    .then(data => {
      this.setLyrics (data.lrc.lyric)
      this.lyrics = data.lrc.lyric
      console.log(data.lrc.lyric)
    })
  }

  setLyrics(lyrics) {
    this.lyricIndex = -1
    let fragment = document.createDocumentFragment()
    let lyricsArr  = []
    this.lyricsArr = lyricsArr
    lyrics.split(/\n/)
      .filter(str => str.match(/\[.+?\]/))
      .forEach(line => {
        let str = line.replace(/\[.+?\]/g, '')
        line.match(/\[.+?\]/g).forEach(t=>{
          t = t.replace(/[\[\]]/g,'')
          let milliseconds = parseInt(t.slice(0,2))*60*1000 + parseInt(t.slice(3,5))*1000 + parseInt(t.slice(6))
          lyricsArr.push([milliseconds, str])
        })
      })
      lyricsArr.filter(line => line[1].trim() !== '').sort((v1, v2) => {
        if(v1[0] > v2[0]) {
          return 1
        } else {
          return -1
        }
      }).forEach(line => {
          let node = document.createElement('p')
          node.setAttribute('data-time', line[0])
          node.innerText = line[1]
          fragment.appendChild(node)
        })
      this.root.querySelector('.panel-lyrics .container').innerHTML = ''
      this.root.querySelector('.panel-lyrics .container').appendChild(fragment)
  }

  locateLyric() {
    if(this.lyricsArr.length === 0) return 
    let currentTime = this.audio.currentTime*1000
    let nextLineTime = this.lyricsArr[this.lyricIndex+1][0]
    if(currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1) {
      this.lyricIndex++
      let node = this.root.querySelector('[data-time="'+this.lyricsArr[this.lyricIndex][0]+'"]')
      if(node) this.setLyricToCenter(node)
      this.root.querySelectorAll('.photo-panel .lyric p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
      this.root.querySelectorAll('.photo-panel .lyric p')[1].innerText = this.lyricsArr[this.lyricIndex+1] ? this.lyricsArr[this.lyricIndex+1][1] : ''
      
    }
  }

  setLyricToCenter(node) {
    let translateY = node.offsetTop - this.root.querySelector('.panel-lyrics').offsetHeight / 2
    translateY = translateY > 0 ? translateY : 0
    this.root.querySelector('.panel-lyrics .container').style.transform = `translateY(-${translateY}px)`
    this.root.querySelectorAll('.panel-lyrics p').forEach(node => node.classList.remove('current'))
    node.classList.add('current')
  }

  setProgerssBar() {
    let percent = (this.audio.currentTime * 100 /this.audio.duration) + '%'
    this.root.querySelector('.bar .progress').style.width = percent
    this.root.querySelector('.time-start').innerText = this.formateTime(this.audio.currentTime)
  }

  formateTime(secondsTotal) {
    let minutes = parseInt(secondsTotal/60)
    minutes = minutes >= 10 ? '' + minutes : '0' + minutes
    let seconds = parseInt(secondsTotal%60)
    seconds = seconds >= 10 ? '' + seconds : '0' + seconds
    return minutes + ':' + seconds
  }

}

window.p = new Player('#player')