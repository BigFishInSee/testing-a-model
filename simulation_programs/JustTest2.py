import numpy as np
import matplotlib.pyplot as plt

mass = 0.0135
Cd = 2.2
A = 0.00028
R_E = 6371e3
G = 6.67430e-11
M_E = 5.972e24

#density
rho0 = 1.225
H = 8500


dt = 3600*24*30#Too slow
brunAlt = 120e3#google gemeni

#Adjust if ur ram dies
upscale = 1e15

# Circular orbit
h0 = 500e3
areaCirc = R_E + h0
veloCirc = np.sqrt(G*M_E/areaCirc)
altCirc = [areaCirc - R_E]
timeCirc = [0]
t = 0

while areaCirc - R_E > brunAlt:
    rho = rho0 * np.exp(-(areaCirc - R_E)/H) * upscale
    Fd = 0.5 * Cd * A * rho * veloCirc**2
    da = -2 * areaCirc**2 * Fd / (G*M_E*mass) * dt
    areaCirc += da
    if areaCirc < R_E + brunAlt: areaCirc = R_E + brunAlt
    veloCirc = np.sqrt(G*M_E/areaCirc)
    t += dt
    altCirc.append(areaCirc - R_E)
    timeCirc.append(t/(3600*24))

    #delete later ts for debugging
    print(areaCirc - R_E)

altCircStoredVar = np.array(altCirc)/1e3
timeCircDays = np.array(timeCirc)

#Ellipti orbit
r_p = R_E + 494e3
r_a = R_E + 500e3

#eclipse not centre
a_ell = (r_p + r_a)/2
e_ell = (r_a - r_p)/(r_a + r_p)

perigees = [r_p]
apogees = [r_a]
timesELL = [0]
t = 0

while r_p - R_E > brunAlt:
    rho = rho0 * np.exp(-(r_p - R_E)/H) * upscale
    Fd = 0.5 * Cd * A * rho * veloCirc**2
    da = -2 * a_ell**2 * Fd / (G*M_E*mass) * dt
    a_ell += da
    e_ell *= 0.995
    r_p = a_ell*(1-e_ell)
    r_a = a_ell*(1+e_ell)
    if r_p < R_E + brunAlt: r_p = R_E + brunAlt
    t += dt
    perigees.append(r_p)
    apogees.append(r_a)
    timesELL.append(t/(3600*24))

perigeeHeight = (np.array(perigees) - R_E)/1e3
apogeeHeight = (np.array(apogees) - R_E)/1e3
timeELLStorage = np.array(timesELL)


plt.figure(figsize=(10,6))
plt.plot(timeCircDays, altCircStoredVar, label="Circular Orbit")
plt.plot(timeELLStorage, perigeeHeight, label="Elliptical Perigee")
plt.plot(timeELLStorage, apogeeHeight, label="Elliptical Apogee")
plt.axhline(brunAlt/1e3, color='r', linestyle='--', label="Burn-up altitude")
plt.xlabel("Time (days)")
plt.ylabel("Altitude (km)")
plt.title("Orbit Decay Normal vs Altered")
plt.ylim(100, 520)
plt.grid(True)
plt.legend()
plt.show()

# Burn-up times
burnup_circ_days = timeCircDays[np.argmax(altCircStoredVar <= brunAlt/1e3)]
burnup_circ_years = burnup_circ_days / 365
burnup_ell_days = timeELLStorage[np.argmax(perigeeHeight <= brunAlt/1e3)]
burnup_ell_years = burnup_ell_days / 365

print(f"Circular burn-up: {burnup_circ_days:.1f} days (~{burnup_circ_years:.1f} years)")
print(f"Elliptical burn-up: {burnup_ell_days:.1f} days (~{burnup_ell_years:.1f} years)")
