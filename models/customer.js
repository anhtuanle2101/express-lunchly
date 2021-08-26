/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName || "";
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  // Best of 10
  static async best(){
    const results = await db.query(
      `SELECT C.id AS "id",
          C.first_name AS "firstName",
          C.middle_Name AS "middleName",
          C.last_name AS "lastName",
          C.phone AS "phone", 
          C.notes AS "notes",
          COUNT(*)
        FROM customers C
        JOIN reservations R ON C.id = R.customer_id
        GROUP BY 
          C.id, 
          C.first_name,
          C.middle_name,
          C.last_name,
          C.phone,
          C.notes
        ORDER BY COUNT(R.id) DESC
        LIMIT 10;
      `
    )
    return results.rows.map(c => {
      delete c.count;
      return new Customer(c);
    });
  }

  // Search By Name
  static async searchByName(term) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         middle_name AS "middleName",
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       WHERE first_name = $1
       OR last_name = $1
       OR middle_name = $1
       ORDER BY last_name, first_name`
       , [term]
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         middle_name AS "middleName",
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         middle_name AS "middleName",
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );
    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, middle_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
        [this.firstName, this.middleName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, middle_name=$2, last_name=$3, phone=$4, notes=$5
             WHERE id=$6`,
        [this.firstName, this.middleName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  // Full name
  get fullName(){
    return this.firstName + " " +this.middleName+" "+ this.lastName;
  }

  
}

module.exports = Customer;
