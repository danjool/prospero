
# Install dependencies
```npm install```

# Start the server
```npx vite```

It will have a link to open the locally hosted server in your browser, or
```npx vite --host```
It will have a link to open the locally hosted server in your browser, and it will be accessible from other devices on the same network.

# Build for production
```npx vite build```
(I bet)

# Run the production build
```npx serve dist``` 
(probably)

# In the Game, Dev stuff
- key h opens and closes the dat.gui dev menu
- key j toggles the stats rectangle upper left, keep above 60fpsp (frames per second please)
    - I think you can click the stats and get different views, haven't tried
- clicking on a material in world adds dat dui menu to play with material properties
- space bar toggles first person controls with -ok- mouse look (cursor outside of deadzone center drags camera around)
- WASD to move 

# QnA
- Q: Maybe tank controls no camera?

- Q: Load times?
- A:  Preoptimization.