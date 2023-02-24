function updateEquipmentData(){
    var mac = document.getElementById("identifierList").value;
    console.log("Mac selected: "+mac);
    // var identifier_list = "<%= user_data.identifier_list %>";
    // console.log("Mac selected: "+identifier_list);

    $.ajax({
        url: '/getUsageData',
        type: 'POST',
        data: {
            identifier: mac
        },
        // jsonpCallback: 'callback', // this is not relevant to the POST anymore
        success: function (result) {
            console.log(result)
            document.getElementById("daily_upload").innerHTML = result.user_data.daily_upload;
            document.getElementById("daily_download").innerHTML = result.user_data.daily_download;
            document.getElementById("daily_total").innerHTML = result.user_data.daily_total;
            document.getElementById("this_month_upload").innerHTML = result.user_data.this_month_upload;
            document.getElementById("this_month_download").innerHTML = result.user_data.this_month_download;
            document.getElementById("this_month_total").innerHTML = result.user_data.this_month_total;

            //display charts
            var this_month_upload = result.user_data.this_month_upload;
            var this_month_download = result.user_data.this_month_download;

            displayChart("today");
            displayTotalChart(this_month_upload, this_month_download, 1000);
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);
        },
    });

    $.ajax({
        url: '/getMonthlyUsageData',
        type: 'POST',
        data: {
            identifier: mac
        },
        // jsonpCallback: 'callback', // this is not relevant to the POST anymore
        success: function (result) {
            console.log(result)
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);
        },
    });

    
}

function displayTotalChart(upload, download, limit){
    //doughnut
    var ctxD = document.getElementById("totalDataUsage").getContext('2d');
    var myDoughNutChart = new Chart(ctxD, {
        type: 'doughnut',
        data: {
        labels: ["Download", "Upload", "Data Left"],
        datasets: [{
            data: [download, upload, limit-(upload+download)],
            backgroundColor: ["#3687de", "#46BFBD", "#b1b4b8", "#949FB1", "#4D5360"],
            hoverBackgroundColor: ["#3687de", "#5AD3D1", "#b1b4b8", "#A8B3C5", "#616774"]
        }]
        },
        options: {
            title: {
                display: true,
                text: 'Total Usage'
            },
            responsive: true,
            cutoutPercentage: 80
        }
    });
}

function displayChart(dataType){
    var ctx = document.getElementById("dataUsage").getContext('2d');
    var myBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'March', 'April', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    data: [86, 114, 106, 106, 107, 111, 133, 221, 783, 2478, 234, 234],
                    label: "Africa",
                    borderColor: "#458af7",
                    backgroundColor:'#458af7',
                    fill: false
                }, {
                    data: [282, 350, 411, 502, 635, 809, 947, 1402, 3700, 5267, 2343, 334],
                    label: "Asia",
                    borderColor: "#8e5ea2",
                    fill: true,
                    backgroundColor:'#8e5ea2'
                    
                }, {
                    data: [168, 170, 178, 190, 203, 276, 408, 547, 675, 734, 234, 234],
                    label: "Europe",
                    borderColor: "#3cba9f",
                    fill: false,
                    backgroundColor:'#3cba9f'
                    
                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'Usage History'
                }
            }
        });
}