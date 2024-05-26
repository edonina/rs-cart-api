import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Cart, CartItem, Product } from '../models';

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const dbOptions = {
  host: PG_HOST,
  port: parseInt(PG_PORT),
  database: PG_DATABASE,
  user: PG_USER,
  password: PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 5000,
};
let pool;

@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};
  constructor() {
    if (!pool) {
      pool = new Pool(dbOptions);
    }
  }

  async findByUserId(userId: string): Promise<Cart> {
    const client = await pool.connect();
    const { rows } = await client.query(
      `select * from carts left join cart_items on carts.id = cart_items.cart_id where user_id = '${userId}'`,
    );

    const result: Cart = {
      id: rows[0].cart_id,
      items: [],
    };

    result.items = rows.map(row => {
      const product: Product = {
        id: row.product_id,
      };

      const cartItem: CartItem = {
        product,
        count: row.count,
      };

      return cartItem;
    });
    client.end();
    return result;
  }

  async createByUserId(userId: string) {
    const client = await pool.connect();
    const query = 'INSERT INTO carts(user_id) values($1)';
    const {
      rows: [cart],
    } = client.query(query, [userId]);
    client.end();
    return cart;
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }
    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    const client = await pool.connect();
    const cart = await this.findOrCreateByUserId(userId);

    const itemsToRemoveFromCart = cart.items.filter(
      ({ product: cartProduct }) => {
        return items.find(({ product }) => cartProduct.id === product.id)
      }
    );

    const itemsToCreate = items.filter(
      item => !cart.items.find(({ product }) => product.id === item.product.id),
    );

    if (itemsToRemoveFromCart.length) {
      await Promise.all(
        itemsToRemoveFromCart.map(item => client.query(
            `DELETE FROM cart_items WHERE cart_id = '${cart.id}' and product_id = '${item.product.id}'`,
          )
        ),
      );
    }

    if (itemsToCreate.length) {
      await Promise.all(
        itemsToCreate.map(item =>
          client.query(
            'INSERT INTO cart_items (cart_id, product_id, count) VALUES ($1, $2, $3)',
            [cart.id, item.product.id, item.count],
          ),
        ),
      );
    }
    await client.end();
    return this.findOrCreateByUserId(userId);
  }

  removeByUserId(userId): void {
    this.userCarts[userId] = null;
  }
}