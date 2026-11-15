import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import os, re, shutil, subprocess, base64, sys
SRC=os.path.join(ROOT,'build','att')
OUT=os.path.join(ROOT,'build','tpl')
os.makedirs(OUT, exist_ok=True)
res={}
for key,src,top in [('IDSS','9905a83a',1350),('IMH','45932168',None)]:
    d=f'{OUT}/{key}'
    if os.path.exists(d): shutil.rmtree(d)
    shutil.copytree(f'{SRC}/{src}', d)
    p=f'{d}/word/document.xml'; x=open(p,encoding='utf8').read()
    bs=x.index('<w:body>')+8
    sect=x[x.rindex('<w:sectPr'):x.rindex('</w:body>')]
    if top: sect=sect.replace('w:top="536"',f'w:top="{top}"')
    open(p,'w',encoding='utf8').write(x[:bs]+'@@BODY@@'+sect+'</w:body></w:document>')
    fp=f'{d}/word/footer1.xml'; f=open(fp,encoding='utf8').read()
    root=re.search(r'<w:ftr[^>]*>',f); head=f[:root.end()]
    nf = head+'@@CTRL@@@@NAMES@@</w:ftr>' if key=='IDSS' else head+'@@CTRL@@'+f[root.end():]
    open(fp,'w',encoding='utf8').write(nf)
    ct=f'{d}/[Content_Types].xml'; c=open(ct,encoding='utf8').read()
    open(ct,'w',encoding='utf8').write(c.replace('wordprocessingml.template.main+xml','wordprocessingml.document.main+xml'))
    out=f'{OUT}/{key}.docx'
    if os.path.exists(out): os.remove(out)
    subprocess.check_call(f'cd "{d}" && zip -qXrD "{out}" .', shell=True)
    res[key]=base64.b64encode(open(out,'rb').read()).decode()
    print(key, os.path.getsize(out))
APP=os.path.join(ROOT,'app')
s=open(f'{APP}/index.src.html',encoding='utf8').read()
dx=open(f'{APP}/dx.js',encoding='utf8').read()
tpl='const TPL = {IDSS:"%s", IMH:"%s"};'%(res['IDSS'],res['IMH'])
jz=open(os.path.join(ROOT,'app','vendor','jszip.min.js'),encoding='utf8').read()
assert '</script' not in jz
s=s.replace('/*@@JSZIP@@*/',lambda: None) if False else s.replace('/*@@JSZIP@@*/',jz)
s=s.replace('/*@@TPL@@*/',tpl).replace('/*@@DX@@*/',dx)
open(f'{APP}/index.html','w',encoding='utf8').write(s)
print('index.html', len(s))
