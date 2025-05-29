# Use an official Python runtime as a parent image
# Using a specific version and slim variant is good practice
FROM python:3.13-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt ./

# Install any needed packages specified in requirements.txt
# Use --no-cache-dir to keep the image lean and upgrade pip first
RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

# Copy the simulator script and any other necessary files
# from the host machine into the container at /app
COPY . .
# If you have other helper files, copy them too, or use COPY . .

# Make port 80 available to the world outside this container
# (Not strictly necessary for this script as it's an MQTT *client*,
# but included here if you were building a web server)
# EXPOSE 80

# Define environment variables if needed (optional, see note below)
# ENV MQTT_BROKER=mosquitto
ENV MQTT_BROKER_HOST=34.53.7.133
# Run simulator.py when the container launches
CMD ["python", "./simulator.py"]