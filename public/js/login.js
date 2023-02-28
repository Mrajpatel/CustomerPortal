function login(){
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // user.push({ "usename":username, "password":password});
    var client = {};
    client.username = username;
    client.password = password;

    if(username.trim() !== "" && password.trim() !== ""){
        console.log(client);
        $.ajax({
            type: 'POST',
            data: client,
            url:"/verifyLogin",
            success: function (res) {
                console.log(res);
                if(res.success){
                    console.log("Login Successful");
                    document.getElementById("error_msg").style.display = "none";
                    window.location.href = "/home";
                }else{
                    console.log("Login Failed");
                    document.getElementById("error_msg").style.display = "block";
                }
            },
            error: function (jqXhr, textStatus, errorMessage) {
                console.log(errorMessage)
            }
        });
    }

}

function createAccount(){
    console.log("Create Acccount button clicket!")
}