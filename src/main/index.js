'use strict'

import {dialog, app, BrowserWindow, ipcMain} from 'electron'
import * as fse from 'fs-extra'
import * as path from 'path'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let pathes = []
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 768,
    useContentSize: true,
    width: 1280
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  ipcMain.on('showdialog', function (e, arg) {
    dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}, function (selectPath) {
      e.sender.send(arg, selectPath)
      pathes = []
      scanDir(selectPath[0], function () {
        e.sender.send('scan-complete', pathes)
      })
    })
  })

  ipcMain.on('syncFile', function (e, select, target) {
    readDir(e, select[0], target[0])
  })

  ipcMain.on('syncSelect', function (e, selectPath, parentsPath, originPath) {
    syncDir(e, selectPath, parentsPath, originPath)
  })
}

function syncDir (e, selectPath, parentsPath, originPath) {
  fse.readdir(parentsPath, (err, files) => {
    if (err) {
      console.warn(err)
      return false
    }
    files.forEach(fileName => {
      let filedir = path.join(parentsPath, fileName)
      if (filedir === originPath) {
        return false
      }
      let fileArr = filedir.split('\\')
      let selectArr = selectPath.split('\\')
      fileArr.forEach((item, index) => {
        if (item === selectArr[index]) {
          return false
        }
        selectArr[index] = fileArr[index]
      })
      let targetPath = selectArr.join('\\')
      fse.copy(selectPath, targetPath, err => {
        if (err) return console.error(err)
        e.sender.send('sync-complete', targetPath)
      })
    })
  })
}

function scanDir (filePath, callback) {
  fse.readdir(filePath, (err, files) => {
    if (err) {
      console.warn(err)
    } else {
      let count = 0
      let checkEnd = function () {
        ++count === files.length && callback()
      }
      // 遍历读取到的文件列表
      files.forEach(fileName => {
        let filedir = path.join(filePath, fileName)
        fse.stat(filedir, (error, stats) => {
          if (error) {
            console.warn('获取文件stats失败')
          } else {
            let isFile = stats.isFile()
            let isDir = stats.isDirectory()
            if (isFile) {
              checkEnd()
            }
            if (isDir) {
              pathes.push(filedir)
              scanDir(filedir, checkEnd)
            }
          }
        })
      })
    }
  })
}

function readDir (e, select, target) {
  fse.copy(select, target, err => {
    if (err) {
      e.sender.send('copy-complete', '复制失败')
      return console.error(err)
    }
    console.log('success!')
    e.sender.send('copy-complete', '复制成功')
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
