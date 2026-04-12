const fs = require('fs');
let code = fs.readFileSync('App.js', 'utf-8');

const target = `        ) : (
          <Stack.Screen name="Main">
            {props => <DrawerNavigator {...props} handleLogout={handleLogout} />}
          </Stack.Screen>
        )}`;

const replacement = `        ) : (
          <>
            <Stack.Screen name="Main">
              {props => <DrawerNavigator {...props} handleLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}`;

code = code.replace(target, replacement);

fs.writeFileSync('App.js', code);
