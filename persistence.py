from typing import Optional

import databases

import ormar
import sqlalchemy

DATABASE_URL = "sqlite:///db.sqlite"
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()


class BaseMeta(ormar.ModelMeta):
    metadata = metadata
    database = database


class Game(ormar.Model):
    class Meta(BaseMeta):
        tablename = "games"

    uuid: int = ormar.UUID(primary_key=True)
    host: Optional[str] = ormar.String(max_length=100, nullable=True)
    player: Optional[str] = ormar.String(max_length=100, nullable=True)
    host_front: Optional[bool] = ormar.Boolean(nullable=True)
    host_back: Optional[bool] = ormar.Boolean(nullable=True)


async def create_game(uuid, host):
    return await Game.objects.create(uuid=uuid, host=host)


# not being used at this moment
async def update_game(uuid, player=None, front=None, back=None):
    await Game.objects.get(uuid=uuid).update(player=player, host_front=front, host_back=back)


# Configuration. Do it at setup time
engine = sqlalchemy.create_engine(DATABASE_URL)
metadata.drop_all(engine)
metadata.create_all(engine)
