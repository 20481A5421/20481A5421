const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Register your company with the John Doe Railway Server
app.post('/train/register', async (req, res) => {
  try {
    const response = await axios.post('http://104.211.219.98/train/register', {
      companyRollNumber: '20481A5421', // Replace with your company's roll number
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register with the server' });
  }
});

// Retrieve the train schedule for the next 12 hours
app.get('/trains', async (req, res) => {
  try {
    // Authenticate and obtain the authentication token from the server
    const authToken = await authenticateAndGetToken();

    // Fetch the train schedule from the John Doe Railway Server API
    const response = await axios.get('http://104.211.219.98/train/schedule', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const currentTime = new Date();

    // Filter and transform the train data based on the requirements
    const trains = response.data.trains
      .filter(train => {
        const departureTime = new Date(train.departureTime);
        const timeDifferenceInMinutes = Math.floor((departureTime - currentTime) / 60000);

        return timeDifferenceInMinutes > 30 && timeDifferenceInMinutes <= 720;
      })
      .map(train => ({
        trainNumber: train.trainNumber,
        departureTime: train.departureTime,
        arrivalTime: train.arrivalTime,
        sleeperPrice: train.prices.sleeper,
        acPrice: train.prices.ac,
        sleeperAvailability: train.seatAvailability.sleeper,
        acAvailability: train.seatAvailability.ac,
      }))
      .sort((a, b) => {
        // Sort trains by ascending order of price, descending order of tickets,
        // and descending order of departure time
        if (a.sleeperPrice !== b.sleeperPrice) {
          return a.sleeperPrice - b.sleeperPrice;
        }

        if (a.sleeperAvailability !== b.sleeperAvailability) {
          return b.sleeperAvailability - a.sleeperAvailability;
        }

        const departureTimeA = new Date(a.departureTime);
        const departureTimeB = new Date(b.departureTime);

        return departureTimeB - departureTimeA;
      });

    res.json(trains);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve train schedule' });
  }
});

// Helper function to authenticate and obtain the authentication token
async function authenticateAndGetToken() {
  try {
    const response = await axios.post('http://104.211.219.98/train/authenticate', {
      companyRollNumber: '20481A5421', // Replace with your company's roll number
      accessCode: 'dWGzNM', // Replace with the access code provided in the email
    });

    return response.data.token;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});