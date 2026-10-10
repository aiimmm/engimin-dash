<!-- METHOD: POST -->
https://liohd.travelio.com/v1/api/login

<!-- REQUEST BODY: -->
{
    "username":"admin",
    "password":"admin123"
}

<!-- RESPONSE -->
{
  "success": true,
  "data": [
    {
      "_id": "6a0bde1e7eacb3c3910d6cc0",
      "name": "Moh. Rahim",
      "usr": "moh.rahim",
      "pwd": "9096aab5858f6abe5a7be1a5d5e988e84839d1fc94e97d0a17a7",
      "email": "muhammadrahim.travelio@gmail.com",
      "isActive": true,
      "isLoginWithEmail": true,
      "isNeedChangePass": false
    },
    {
      "expired": "1791576747619"
    },
    {
      "posDate": "2026-10-09"
    }
  ],
  "encryptedUserData": "5b4c286cae5c567bbeddce49c266f8522c30e4facb56ea7ed310d2afb264137e66bbd2d1f92b9d8788270066aad5537ea2bbea82970465ccde9500d03908b526ef"
}

<!-- 
Halaman Login
Route: /auth/login

Buatkan saya halaman login dengan mempost data ke api di atas. untuk kompoonen, lib, berikan dengan lengkap, cepat, dan aman, tanpa ketahuan kalau api ini saya mirror
 -->
