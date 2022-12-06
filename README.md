# artus-common-bin

POC of command line base on artusjs


## 默认 demo

```bash
$ npx ts-node examples/egg-bin/bin.ts -h
```

## 继承 demo

继承 egg-bin 并且增添指令的 demo

```bash
$ npx ts-node examples/chair-bin/bin.ts -h
```

## 简单 demo

```bash
$ npx ts-node examples/simple-bin/bin.ts -h
```

## 插件 demo

- examples/usage-plugin: `-h, --help`
- examples/version-plugin: `-v, --version`
- examples/codegen-plugin `codegen 指令`
- examples/codegen-extra `拓展 codegen 指令`
