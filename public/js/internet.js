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
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);
        },
    });
 }