var jsCode = `
var placeholder = document.createDocumentFragment()

function generatorCSS (url) {
  var link = document.createElement('link')
  link.href = url
  link.media = 'all'
  link.rel = 'stylesheet'
  return link
}

function generatorJS (url) {
  var scriptTag = document.createElement('script')
  scriptTag.src = url
  return scriptTag
}

function router2Dep () {
  var url = location.pathname
  for (var chunk in routerOp) {
    var chunks = chunk.split('.')
    var chunkName = chunks[0]
    var chunkType = chunks[1]
    if (url.includes(chunkName)) {
      if (/js$/.test(chunkType)) {
        placeholder.append(generatorJS(routerOp[chunk]))
      } else {
        placeholder.append(generatorCSS(routerOp[chunk]))
      }
    }
  }
  document.body.append(placeholder)
}

router2Dep()
`

/**
 * Webpack插件，主要用于根据路由选择不同的chunk进行动态依赖加载
 * @param {} options 
 */
function router2DepPlugin(options) {
  this.baseChunk = options.baseChunk
}

router2DepPlugin.prototype.apply = function (compiler) {
  var bp = this.baseChunk
  // 异步的事件钩子
  compiler.plugin('emit', function (compilation, callback) {
      var files = 'var routerOp = {\n'
      // 遍历compilation对象获取page对应的chunk和对应输出的JS文件
      for (var filename in compilation.assets) {
        if (filename.includes(bp)) {
          var chunkNames = filename.split('.')
          // var chunkName = chunkNames[3] + '.' + chunkNames[chunkNames.length - 1]
          var chunkName = 'cluster' + '.' + chunkNames[chunkNames.length - 1]
          files += ('"' + chunkName + '"' + ': ' + '"' + filename + '"' + ',\n')
        }
      }

      // 生成文件hash
      var hash = Math.random().toString(36).substr(2)
      // 拼接文件内容
      files += `}${jsCode}`

      // 生成JS文件
      compilation.assets['js/loadDep.' + hash + '.js'] = {
        source: function () {
          return files
        },
        size: function () {
          return files.length
        }
      }

      callback()
  })
}

module.exports = router2DepPlugin
