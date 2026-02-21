import re

raw_data = """
606		

Kyle McCord (PHI)

QB72	9			

-

607		

Simi Fehoko (ARI)

WR201	8			

-

608		

Chris Blair (ATL)

WR202	5			

-

609		

Bub Means (NO)

WR203	11			

-

610		

Cole Turner (FA)

TE108	-			-	

-

611		

Jarrett Stidham (DEN)

QB73	12			

-

612		

Jake Haener (NO)

QB74	11			

-

613		

LaJohntay Wester (BAL)

WR204	7			

-

614		

Teagan Quitoriano (ATL)

TE109	5			

-

615		

Brandon Allen (TEN)

QB75	10			

-

616		

Bo Melton (GB)

WR205	5			

-

617		

Jawhar Jordan (HOU)

RB159	6			

-

618		

Hendon Hooker (FA)

QB76	-			-	

-

619		

Braxton Berrios (HOU)

WR206	6			

-

620		

Ronnie Rivers (LAR)

RB160	8			

-

621		

Rakim Jarrett (FA)

WR207	-			-	

-

622		

Tim Jones (JAC)

WR208	
"""

lines = raw_data.strip().split('\n')
results = []
current_rank = None

for line in lines:
    line = line.strip()
    if not line:
        continue
    if 'out of 5 stars' in line:
        continue
    if 'Coach' in line:
        continue
    if 'Tier' in line:
        continue
    if 'Customize' in line:
        continue
    
    rank_match = re.match(r'^(\d+)\s*$', line)
    if rank_match:
        current_rank = rank_match.group(1)
        continue
    
    player_match = re.match(r'^([A-Za-z\'\.\-\s]+(?:Jr\.|Sr\.|III|II|IV)?)\s*\(([A-Z]{2,3})\)(?:\s*O)?$', line)
    if player_match and current_rank:
        name = player_match.group(1).strip()
        team = player_match.group(2)
        results.append(f"{current_rank} {name} ({team})")
        current_rank = None

for r in results:
    print(r)
