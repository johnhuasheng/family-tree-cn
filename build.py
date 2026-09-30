# -*- coding: utf-8 -*-
"""把 src/ 里的源文件拼成两份网页：
   家族辈分谱.html      —— 双击就能在浏览器里打开的本地版
   dist/artifact.html   —— 发布到 claude.ai 在线页面用的版本
用法：python3 build.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'

def src(name):
    with open(os.path.join(HERE, 'src', name), encoding='utf-8') as f:
        return f.read()

def write(path, text):
    full = os.path.join(HERE, path)
    os.makedirs(os.path.dirname(full) or HERE, exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print('写出', path, len(text.encode('utf-8')) // 1024, 'KB')

reset = src('reset.css').strip()
data = json.dumps(json.loads(src('data.json')), ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
code = "(function(){'use strict';\n" + src('engine.js') + "\n" + src('g3d.js') + "\n" + \
       src('app.js').replace("'__RESET__'", json.dumps(reset)) + "\n})();\n"
assert '</script' not in code.lower(), '脚本里不能直接出现 </script>'

def body(local):
    three = '<script src="' + CDN + '"></script>\n'
    if local:  # 没网时退回同文件夹里的 three.min.js
        three += '<script>window.THREE||document.write(\'<script src="three.min.js"><\\/script>\')</script>\n'
    return (src('head.html') +
            '<script type="application/json" id="family-data">' + data + '</script>\n' +
            three + '<script id="app-code">' + code + '</script>\n')

write('dist/artifact.html', body(False))
write('家族辈分谱.html',
      '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
      '<link rel="icon" href="tools/family.ico">'
      '<style>' + reset + '</style></head><body>' + body(True) + '</body></html>\n')
