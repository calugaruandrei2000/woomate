async function loadDashboard(){

const store = localStorage.getItem("storeId")

const res = await fetch(`/dashboard?store=${store}`)
const data = await res.json()

document.getElementById("interactions").innerText = data.metrics.interactions
document.getElementById("conversions").innerText = data.metrics.conversions
document.getElementById("revenue").innerText = data.metrics.revenue

const activityList = document.getElementById("activity")

data.activity.forEach(a=>{
const li = document.createElement("li")
li.innerText = a.message
activityList.appendChild(li)
})

}

loadDashboard()
