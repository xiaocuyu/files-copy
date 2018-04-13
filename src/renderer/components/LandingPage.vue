<template>
  <div id="wrapper">
    <main>
      <div class="left-side">
        <div class="doc" style="margin-bottom:20px;">
          <button @click="addEvent('select')">选择原始文件夹</button><br><br>
          <button @click="syncFile">同步</button>
        </div>
        <div class="doc">
          <div class="title alt">选择：{{selectPath}}</div>
          <div class="title alt">结果：
            <p v-for="mes in result">{{mes}} -- '同步完成'</p>
          </div>
        </div>        
      </div>
      <div class="right-side">
        <div v-for="(item, index) in filePathes">
          <input type="checkbox" v-model="item.select">
          {{item.path}}
        </div>
      </div>
    </main>
  </div>
</template>

<script>
  import {ipcRenderer} from 'electron'

  export default {
    name: 'landing-page',
    data () {
      return {
        selectPath: '',
        targetPath: '',
        result: [],
        filePathes: []
      }
    },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      },
      syncFile () {
        this.result = []
        // ipcRenderer.send('syncFile', this.selectPath, this.targetPath)
        this.filePathes.forEach(element => {
          if (element.select) {
            let parentPath = this.selectPath[0].split('\\').slice(0, -1).join('\\')
            ipcRenderer.send('syncSelect', element.path, parentPath, this.selectPath[0])
          }
        })
      },
      addEvent (target) {
        target = target + '-file'
        ipcRenderer.send('showdialog', target)
      }
    },
    mounted () {
      let _this = this
      ipcRenderer.on('select-file', function (event, path) {
        _this.selectPath = path
      })
      ipcRenderer.on('copy-complete', function (event, mes) {
        _this.result = mes
      })
      ipcRenderer.on('sync-complete', function (event, mes) {
        _this.result.push(mes)
      })
      ipcRenderer.on('scan-complete', function (event, pathes) {
        _this.filePathes = pathes.map(item => {
          return {
            path: item,
            select: false
          }
        })
      })
    }
  }
</script>

<style>

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }

  #wrapper {
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    height: 100vh;
    padding: 60px 80px;
    width: 100vw;
  }

  #logo {
    height: auto;
    margin-bottom: 20px;
    width: 420px;
  }

  main {
    display: flex;
    justify-content: space-between;
  }

  main > div { flex-basis: 50%; }

  .left-side {
    display: flex;
    flex-direction: column;
  }

  .welcome {
    color: #555;
    font-size: 23px;
    margin-bottom: 10px;
  }

  .title {
    color: #2c3e50;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .title.alt {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .doc p {
    color: black;
    margin-bottom: 10px;
  }

  .doc button {
    font-size: .8em;
    cursor: pointer;
    outline: none;
    padding: 0.75em 2em;
    border-radius: 2em;
    display: inline-block;
    color: #fff;
    background-color: #4fc08d;
    transition: all 0.15s ease;
    box-sizing: border-box;
    border: 1px solid #4fc08d;
  }

  .doc button.alt {
    color: #42b983;
    background-color: transparent;
  }
</style>
