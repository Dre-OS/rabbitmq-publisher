const express = require('express');
const cors = require('cors');
// const port = 3002;
const amqp = require('amqplib');
const app = express();
app.use(cors());
app.use(express.json());

async function connect(uri) {
    try {
        if (!uri) {
            uri = 'amqp://guest:guest@localhost:5672';
            console.warn("No RabbitMQ URI provided, using default 'amqp://guest:guest@localhost:5672'");
        }
        const connection = await amqp.connect(uri || 'amqp://guest:guest@localhost:5672');
        const channel = await connection.createChannel();
        console.log("Connected to RabbitMQ successfully");
        return { connection, channel };
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        throw error;
    }
}


function composePublisher(connectionUri, exchange, exchangeType, routingKey, queue, options) {
  
  const defaultOptions = {
    durable: true,
    exclusive: false,
    autoDelete: false
  }

  
  return async (message) => {
    try {
      const {connection, channel} = await connect(connectionUri);

      {exchange ?
        channel.assertExchange(exchange, exchangeType, options || defaultOptions) :
        channel.assertQueue(queue, options || defaultOptions)
      }

      channel.publish(exchange, routingKey, Buffer.from(message));
      console.log(`Message published to ${exchange} with routing key ${routingKey}`);
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  };
  
}

module.exports = {
  composePublisher
}

