import numpy as np
import matplotlib.pyplot as plt



massTarget = 0.0135
beamForce0 = 2e-3
eta = 0.7 #cupling
d0 = 10 #Divergence scale

dt = 0.1#time step for calcs
t_max = 60 #max contact time


v = 0.0
d = 10.0

times = []
velocities = []
distances = []


t = 0
while t < t_max:
    
    #Longer = less beam 
    F = eta * beamForce0 / (1 + d/d0)**2
    #accel from momentum trans
    a = F / massTarget
    v += a * dt
    #drift
    d += v * dt
    #store data
    times.append(t)
    velocities.append(v)
    distances.append(d)
    t += dt


times = np.array(times)
velocities = np.array(velocities)
distances = np.array(distances)

plt.figure(figsize=(9,5))

plt.plot(times, velocities, label="Δv (m/s)")
plt.plot(times, distances, label="Separation (m)")

plt.xlabel("Time (seconds)")
plt.ylabel("Distance")
plt.title("Ion Beam Momentum and Distance per Time")
plt.grid(True)
plt.legend()
plt.show()


print(f"Final Δv : {velocities[-1]:.4f} m/s")
print(f"Final separation distance: {distances[-1]:.2f} m")


