# How to Build

Building is straight forward.

The app is built on Tauri and uses npm as the package manager.<br>
**Step 1**: Make sure pre requisites are installed:

- npm: Follow official instructions [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)<br>
- rust: Follow official instructions [here](https://www.rust-lang.org/)
- read official tauri page to get started [here](https://v1.tauri.app/v1/guides/getting-started/prerequisites/)

**Step 2**: Open the repository in the terminal of your choice and run `npm install`<br>
**Step 3**: Build the app, or run it in dev mode if you are doing development:<br>
**Build**

```
npm run tauri build
```

the output will show you the location of the built executable

**Dev**

```
npm run tauri dev
```

this will launch the application in dev mode
