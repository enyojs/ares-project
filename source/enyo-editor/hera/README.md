# Hera
Hera is a Css builder. 


# Usage

User pickes the  declaration on the top right thay want to work on.
Then chose the rule on the left and set the value in lower right.



# Hera flow

loadcss
	   \
	   |
	   	dePuzzle       grab the declaration for the list on top right
	   
user chose declaration 
       \
       |
       classgraber	  load the rule and value in to a array
                \
                |
                oldcss     save a copy so we know what to replace
	   			|
	   			|
	   			updatebox       update the output for screen and what replace with


user chose rule

leftpannel.js
       \
       |
       radioActivated in hers.js      select wich input kind to show in valueinput.js
                  \
                  |
                  updatebox    	update the output for screen and what replace with
                  
   
                  
newcss button
			  \
				newRule			show the popup
						\
					     newDeclaration    get the new classname  set this.out  save and reload 