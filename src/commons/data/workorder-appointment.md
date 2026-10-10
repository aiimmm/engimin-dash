<!-- METHOD: POST -->
https://liohd.travelio.com/v1/api/listWoCountNew?id=6a0bde1e7eacb3c3910d6cc0

<!-- REQUEST BODY -->
{
  "status": [
    "1",
    "2"
  ],
  "cluster_id": [],
  "engginerId": "",
  "departmentInCharge": "",
  "skipCountPaging": 0,
  "poStatus": "",
  "pos_date": ""
}

<!-- RESPONSE -->
{
  "success": null, // boolean
  "count": null, // number
}

<!-- METHOD: POST -->
https://liohd.travelio.com/v1/api/listWONewSedangDiRefactor?id=6a0bde1e7eacb3c3910d6cc0

<!-- REQUEST BODY -->
{
  "status": [
    "1",
    "2"
  ],
  "cluster_id": [],
  "engginerId": "",
  "departmentInCharge": "",
  "skipCountPaging": 0,
  "poStatus": "",
  "pos_date": "",
  "limit": "",
  "offset": 0
}

<!-- RESPONSE -->
{
  "success": true,
  "data": [
    {
      "isCTOApproved": null, // number: 1 or 0
      "ci_date": null, // string
      "extend_rr_id": null, // string
      "ota_book_number": null, // string
      "co_date": null, // string
      "co_ota_book_number": null, // string
      "towername": null, // string
      "roomname": null, // string
      "oldroomname": null, // string
      "ws_id": null, // number
      "wo_status": null, // string
      "isIncludeCloseOut": null, // number: 1 or 0
      "isWoManageByOwner": null, // number: 1 or 0
      "isWoCompleteByGuest": null, // number: 1 or 0
      "furnishedByTravelio": null, // number: 1 or 0
      "furnished_by_travelio": null, // number: 1 or 0
      "endcontract_date": null, // string
      "breakcontract_date": null, // string
      "roomcode": null, // string
      "roomstatuses_name": null, // string
      "id": null, // number
      "wo_type": null, // string
      "wo_subtype": null, // string
      "wo_articles": null, // string
      "remark": null, // string
      "wo_roomtype_id": null, // number
      "department_in_charge": null, // string
      "wo_no": null, // string
      "assignto_id": null, // number
      "workorderstatuses_id": null, // number
      "action_date": null, // string
      "completed_user": null, // string
      "completed_date": null, // string
      "cancelled_user": null, // string
      "cancelled_date": null, // string
      "fo_rooms_id": null, // number
      "include_closeout": null, // number: 1 or 0
      "wo_manage_by_owner": null, // number: 1 or 0
      "ctoPrice": null, // string
      "ctoStatus": null, // string
      "include_approve_cto": null, // number: 1 or 0
      "reff_booking_id": null, // string
      "is_guestAppointment": null, // string
      "reservationtraces_id": null, // number
      "reservationtraces_status": null, // string
      "rejected_wo_guarantee_date": null, // string
      "property_status": null, // string
      "hotel_status": null, // string
      "eng1": null, // number
      "cluster_name": null, // string
      "ctoLength": 0, // number
      "tracingSchedule": [
        {
          "eng1name": null, // string
          "id": null, // number
          "status": null, // string
          "action_date": null, // string
          "eng1": null, // number
          "workorders_id": null, // number
          "telegram_user": null, // string
          "cancelled_date": null, // string
          "cancelled_user": null, // string
          "completed_date": null, // string
          "complete_user": null, // string
          "rejected_wo_guarantee_date": null, // string
          "enggineer": null // string
        }
      ],
      "currentEngineerName": null, // string
      "isEngineerSet": null, // boolean
      "engineeringPropertyFee": null, // string
      "isEngineeringPropertyFeePaid": null, // boolean
      "paymentList": [], // array
      "totalPaymentFeeAmount": null, // number
      "subTotalPaymentFeeAmount": null, // number
      "travelioPremium": null // boolean
    }
  ],
  "count": 1 // number
}

<!-- 
Halaman Appointment
Route: /dashboard/appointment
Heading:
Subheading:

Saya mau untuk halaman ini akan menampilkan 

 -->
