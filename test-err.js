fetch('http://localhost:3000/src/main.tsx').then(r => r.text()).then(t => console.log(t.substring(0, 100)))
