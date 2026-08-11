-- gate-78 P5: test data created by the single real /api/solve verification call.
-- device_id: c0ac2118-eb38-468c-af48-154ba0bef811 (synthetic, node crypto.randomUUID())
-- question_id: 6e8c5abf-772f-428e-90ba-0ca1b413ae98
-- attempt_id:  abe0ebee-8edf-44d2-982f-7c0c16ff5aad
-- item_id:     251cfb9d-773d-4598-b125-2e07e3ebe049
-- invite used: invite01 (user-provided test invite, not reused by any real student)
-- Deleted in FK-safe (children-first) order.

delete from private.answer_access_log where question_id = '6e8c5abf-772f-428e-90ba-0ca1b413ae98';
delete from private.step_answers where question_id = '6e8c5abf-772f-428e-90ba-0ca1b413ae98';
delete from private.question_answers where question_id = '6e8c5abf-772f-428e-90ba-0ca1b413ae98';
delete from step_events where attempt_id = 'abe0ebee-8edf-44d2-982f-7c0c16ff5aad';
delete from attempt_items where attempt_id = 'abe0ebee-8edf-44d2-982f-7c0c16ff5aad';
delete from attempts where id = 'abe0ebee-8edf-44d2-982f-7c0c16ff5aad';
delete from question_translations where question_id = '6e8c5abf-772f-428e-90ba-0ca1b413ae98';
delete from questions where id = '6e8c5abf-772f-428e-90ba-0ca1b413ae98';
