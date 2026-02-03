async function register(){

const storeUrl = document.getElementById("storeUrl").value
const email = document.getElementById("email").value
const password = document.getElementById("password").value

const params = new URLSearchParams(window.location.search)
const plan = params.get("plan") || "trial"

const res = await fetch("/register-store",{
method:"POST",
headers:{'Content-Type':'application/json'},
body: JSON.stringify({storeUrl,email,password,plan})
})

const data = await res.json()

if(data.success){

localStorage.setItem("storeId",storeUrl)

alert("Cont creat. Descarcă pluginul!")

window.location = "dashboard.html"

}

}
