// const express = require('express');
// const cors = require('cors');
// const port = 3002;
const amqp = require('amqplib');
// const app = express();
// app.use(cors());
// app.use(express.json());

async function connect(uri) {
    try {
        if (!uri) {
            uri = 'amqp://guest:guest@localhost:5672';
            console.warn("No RabbitMQ URI provided, using default 'amqp://guest:guest@localhost:5672'");
        }
        const connection = await amqp.connect(uri);
        const channel = await connection.createChannel();
        console.log("Connected to RabbitMQ successfully");
        return { connection, channel };
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        throw error;
    }
}


function composePublisher({exchange, exchangeType, routingKey, queue, headers, options}) {
  const defaultOptions = {
    durable: true,
    exclusive: false,
    autoDelete: false
  }

  
  return async (channel, message) => {
    try {
      // const {connection, channel} = await connect(connectionUri);

      {exchange ?
        channel.assertExchange(exchange, exchangeType, options || defaultOptions) :
        channel.assertQueue(queue, options || defaultOptions)
      }

      if (exchangeType === 'fanout') {
        channel.publish(exchange, '', Buffer.from(message));
      } else if (exchangeType === 'direct' || exchangeType === 'topic') {
        channel.publish(exchange, routingKey, Buffer.from(message)) 
      } else if (exchangeType === 'headers') {
        channel.publish(exchange, routingKey, Buffer.from(message), { headers });
      }
      else {
        throw new Error(`Unsupported exchange type: ${exchangeType}`);
      }
      console.log(`Message published to ${exchange} with routing key ${routingKey}`);
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  };
  
}

// app.listen(port, "0.0.0.0", () => {
//   console.log(`Publisher service is running on port ${port}`);
// });

module.exports = {
  connect,
  composePublisher
}

