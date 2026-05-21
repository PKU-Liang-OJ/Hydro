<!--
Source: https://raw.githubusercontent.com/hydro-dev/hydro-dev.github.io/docs/content/docs/Hydro/dev/PERM_PRIV.md
Docs URL: https://hydro.js.org/zh/docs/Hydro/dev/PERM_PRIV
Fetched: 2026-05-21T15:45:42.791Z
Asset policy: image files are not mirrored; Markdown image links point to remote sources.
-->

---
title: 权限节点
---

Hydro 的权限使用位运算处理。  
例：若某用户具有 `PRIV_EDIT_SYSTEM` 与 `PRIV_SET_PERM` 权限，应设置为 `(1<<0)|(1<<1)` （即 3）

可以看 [代码](https://github.com/hydro-dev/Hydro/blob/master/packages/common/permission.ts) 中关于此部分的内容。

扩展阅读：[权限结构](../user/permission)
