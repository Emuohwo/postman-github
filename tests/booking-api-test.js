import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 5, // number of virtual users
  duration: '30s', // test duration
};

const BASE_URL = 'https://restful-booker.herokuapp.com';

export default function () {
  // 1. Get Booking Ids
  let res = http.get(`${BASE_URL}/booking`);
  check(res, {
    'Get Booking Ids - status 200': (r) => r.status === 200,
  });

  // 2. Create Booking
  let payload = JSON.stringify({
    firstname: 'Testers',
    lastname: 'Talk',
    totalprice: 1000,
    depositpaid: true,
    bookingdates: {
      checkin: '2018-01-01',
      checkout: '2019-01-01',
    },
    additionalneeds: 'super bowls',
  });

  let headers = { 'Content-Type': 'application/json' };
  res = http.post(`${BASE_URL}/booking`, payload, { headers });
  check(res, {
    'Create Booking - status 200': (r) => r.status === 200,
    'Create Booking - has firstname': (r) =>
      JSON.parse(r.body).booking.firstname === 'Testers',
  });

  let bookingId = JSON.parse(res.body).bookingid;

  // 3. Get Booking Details
  res = http.get(`${BASE_URL}/booking/${bookingId}`);
  check(res, {
    'Get Booking Details - status 200': (r) => r.status === 200,
    'Get Booking Details - totalprice correct': (r) =>
      JSON.parse(r.body).totalprice === 1000,
  });

  // 4. Token Generator
  let authPayload = JSON.stringify({
    username: 'admin',
    password: 'password123',
  });
  res = http.post(`${BASE_URL}/auth`, authPayload, { headers });
  check(res, {
    'Token Generator - status 200': (r) => r.status === 200,
  });
  let token = JSON.parse(res.body).token;

  // 5. Update Booking
  let updatePayload = JSON.stringify({
    firstname: 'UpdatedName',
    lastname: 'UpdatedLast',
    totalprice: 111,
    depositpaid: true,
    bookingdates: {
      checkin: '2018-01-01',
      checkout: '2019-01-01',
    },
    additionalneeds: 'super bowls',
  });

  res = http.put(`${BASE_URL}/booking/${bookingId}`, updatePayload, {
    headers: { ...headers, Cookie: `token=${token}` },
  });
  check(res, {
    'Update Booking - status 200': (r) => r.status === 200,
  });

  // 6. Partial Update Booking
  let patchPayload = JSON.stringify({ firstname: 'Testers Talk' });
  res = http.patch(`${BASE_URL}/booking/${bookingId}`, patchPayload, {
    headers: { ...headers, Cookie: `token=${token}` },
  });
  check(res, {
    'Partial Update Booking - status 200': (r) => r.status === 200,
  });

  // 7. Delete Booking
  res = http.del(`${BASE_URL}/booking/${bookingId}`, null, {
    headers: { ...headers, Cookie: `token=${token}` },
  });
  check(res, {
    'Delete Booking - status 201': (r) => r.status === 201,
  });

  sleep(1);
}
